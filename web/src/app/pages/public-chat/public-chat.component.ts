import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChatService } from '../../services/chat.service';
import { environment } from '../../../environments/environment';
import { marked } from 'marked';
import katex from 'katex';

@Component({
  selector: 'app-public-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-chat.component.html'
})
export class PublicChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  apiKey: string = '';
  agentData: any = null;
  sessionId: string = '';

  messages: { text: string; html: string; isUser: boolean }[] = [];
  rawHistory: any[] = [];
  newMessage = '';
  isLoading = false;
  isOpen = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.apiKey = this.route.snapshot.paramMap.get('apiKey') || '';

    const storageKey = `public_chat_session_${this.apiKey}`;
    let savedSessionId = localStorage.getItem(storageKey);
    if (!savedSessionId) {
      savedSessionId = 'sess_pub_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(storageKey, savedSessionId);
    }
    this.sessionId = savedSessionId;

    this.http.get<any>(`${environment.apiUrl}/tenants/public/${this.apiKey}`).subscribe(data => {
      this.agentData = data;
      this.isLoading = true;
      this.chatService.getHistory(this.sessionId).subscribe({
        next: (history) => {
          this.rawHistory = history || [];
          
          if (this.rawHistory.length > 0) {
            this.messages = [];
            for (const msg of this.rawHistory) {
              if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                const text = msg.parts[0].text;
                this.messages.push({
                  text,
                  html: msg.role === 'user' ? text : this.renderMarkdown(text),
                  isUser: msg.role === 'user'
                });
              }
            }
          } else {
            const welcomeText = `Hi! I'm ${data.name}. How can I help you?`;
            this.messages = [{ text: welcomeText, html: welcomeText, isUser: false }];
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          const welcomeText = `Hi! I'm ${data.name}. How can I help you?`;
          this.messages = [{ text: welcomeText, html: welcomeText, isUser: false }];
          this.rawHistory = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  resetChat() {
    if (this.sessionId) {
      this.chatService.deleteHistory(this.sessionId).subscribe();
    }

    const storageKey = `public_chat_session_${this.apiKey}`;
    const newSessionId = 'sess_pub_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(storageKey, newSessionId);
    this.sessionId = newSessionId;

    const welcomeText = `Hi! I'm ${this.agentData?.name || 'your assistant'}. How can I help you?`;
    this.messages = [{ text: welcomeText, html: welcomeText, isUser: false }];
    this.rawHistory = [];
    this.cdr.detectChanges();
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.apiKey) return;
    
    const userMsg = this.newMessage;

    this.messages = [...this.messages, { text: userMsg, html: userMsg, isUser: true }];
    this.rawHistory = [...this.rawHistory, { role: 'user', parts: [{ text: userMsg }] }];
    
    this.newMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage(this.apiKey, userMsg, this.sessionId).subscribe({
      next: (res) => {
        this.messages = [...this.messages, { text: res.reply, html: this.renderMarkdown(res.reply), isUser: false }];
        this.rawHistory = res.history || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages = [...this.messages, { text: 'Connection error.', html: 'Connection error.', isUser: false }];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewChecked() {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  private renderMarkdown(text: string): string {
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
      try {
        return '<div class="katex-block">' + katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false }) + '</div>';
      } catch {
        return `<div class="katex-block"><code>${latex.trim()}</code></div>`;
      }
    });

    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, latex) => {
      try {
        return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<code>${latex.trim()}</code>`;
      }
    });

    return marked.parse(processed, { async: false, breaks: true }) as string;
  }
}