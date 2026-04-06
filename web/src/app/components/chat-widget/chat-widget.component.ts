import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { TenantService } from '../../services/tenant.service';
import { marked } from 'marked';
import katex from 'katex';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css'
})
export class ChatWidgetComponent implements AfterViewChecked, OnInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  unreadCount = 1;
  messages: { text: string; html: string; isUser: boolean }[] = [];
  rawHistory: any[] = [];
  newMessage = '';
  isLoading = false;

  tenants: any[] = [];
  selectedApiKey: string = '';
  currentAgentName: string = 'Select an Agent';
  currentAgentData: any = null;
  sessionId: string = '';

  constructor(
    private chatService: ChatService,
    private tenantService: TenantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const myTenantId = localStorage.getItem('tenantId');

    this.tenantService.getTenants().subscribe(data => {
      this.tenants = data;

      const myAgent = this.tenants.find(t => t._id === myTenantId);

      if (myAgent) {
        this.selectAgent(myAgent);
        this.cdr.detectChanges();
      } else if (this.tenants.length > 0) {
        this.selectAgent(this.tenants[0]);
      }
    });
  }

  selectAgent(tenant: any) {
    this.selectedApiKey = tenant.apiKey;
    this.currentAgentName = tenant.name;
    this.currentAgentData = tenant;
    
    const storageKey = `chat_session_${tenant._id}`;
    let savedSessionId = localStorage.getItem(storageKey);
    if (!savedSessionId) {
      savedSessionId = 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(storageKey, savedSessionId);
    }
    this.sessionId = savedSessionId;

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
          const welcomeText = `Hi! I'm ${tenant.name}. How can I help you?`;
          this.messages = [{ text: welcomeText, html: welcomeText, isUser: false }];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        const welcomeText = `Hi! I'm ${tenant.name}. How can I help you?`;
        this.messages = [{ text: welcomeText, html: welcomeText, isUser: false }];
        this.rawHistory = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
    }
    this.cdr.detectChanges();
  }

  resetChat() {
    if (this.sessionId) {
      this.chatService.deleteHistory(this.sessionId).subscribe();
    }

    if (this.currentAgentData) {
      const storageKey = `chat_session_${this.currentAgentData._id}`;
      const newSessionId = 'sess_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(storageKey, newSessionId);
      this.sessionId = newSessionId;
    }

    this.messages = [{ text: `Hi! I'm ${this.currentAgentData?.name || 'your assistant'}. How can I help you?`, html: `Hi! I'm ${this.currentAgentData?.name || 'your assistant'}. How can I help you?`, isUser: false }];
    this.rawHistory = [];
    this.cdr.detectChanges();
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedApiKey) return;
    
    const userMsg = this.newMessage;

    this.messages = [...this.messages, { text: userMsg, html: userMsg, isUser: true }];
    this.rawHistory = [...this.rawHistory, { role: 'user', parts: [{ text: userMsg }] }];

    this.newMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage(this.selectedApiKey, userMsg, this.sessionId).subscribe({
      next: (res) => {
        this.messages = [...this.messages, { text: res.reply, html: this.renderMarkdown(res.reply), isUser: false }];
        this.rawHistory = res.history || [];
        this.isLoading = false;

        if (!this.isOpen) {
          this.unreadCount++;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.messages = [...this.messages, { text: 'Connection error.', html: 'Connection error.', isUser: false }];
        this.isLoading = false;
        if (!this.isOpen) {
          this.unreadCount++;
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
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