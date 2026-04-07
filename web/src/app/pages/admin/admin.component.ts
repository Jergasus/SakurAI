import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { KnowledgeService } from '../../services/knowledge.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatWidgetComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  agentMemories: any[] = [];
  analytics: any = { totalMessages: 0, totalChats: 0, recentSessions: [] };
  selectedTenant: any = null;
  private pollingInterval: any;

  newKnowledgeContent = '';
  isLoadingKnowledge = false;
  isSaving = false;
  uploadProgress = '';

  activeModal: 'general' | 'appearance' | 'install' | 'tools' | 'knowledge' | 'analytics' | 'account' | null = null;
  isDarkMode = localStorage.getItem('darkMode') === 'true';
  showEmojiPicker = false;
  emojiOptions = ['🌸', '🤖', '💬', '🧠', '💡', '🏥', '🍕', '🔧', '📚', '🛒', '🚀', '❤️'];

  frontendUrl = window.location.origin;

  availableTools: any[] = [];

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'warning' } | null = null;
  toastFading = false;
  private toastTimeout: any;

  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    clearTimeout(this.toastTimeout);
    this.toast = { message, type };
    this.toastFading = false;
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => {
      this.toastFading = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.toast = null;
        this.cdr.detectChanges();
      }, 300);
    }, 2000);
  }

  // Account management
  accountEmail = '';
  accountCurrentPassword = '';
  accountNewPassword = '';
  accountNewPasswordConfirm = '';
  isSavingAccount = false;

  constructor(
    private tenantService: TenantService,
    private knowledgeService: KnowledgeService,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadTenants();

    this.pollingInterval = setInterval(() => {
      if (this.selectedTenant) {
        this.knowledgeService.getAll().subscribe((data: any[]) => {
          if (this.agentMemories.length !== data.length) {
            this.agentMemories = data;
            this.cdr.detectChanges();
          }
        });

        this.chatService.getAnalytics(this.selectedTenant._id).subscribe((data: any) => {
          if (
            this.analytics.totalMessages !== data.totalMessages ||
            this.analytics.totalChats !== data.totalChats ||
            JSON.stringify(this.analytics.recentSessions) !== JSON.stringify(data.recentSessions)
          ) {
            this.analytics = data;
            this.cdr.detectChanges();
          }
        });
      }
    }, 10000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadTenants() {
    this.tenantService.getTenant().subscribe(data => {
      if (data) {
        this.selectTenant(data);
      }
      this.cdr.detectChanges();
    });
  }

  loadMemories() {
    if (!this.selectedTenant) return;
    this.knowledgeService.getAll().subscribe((data) => {
      this.agentMemories = data;
      this.cdr.detectChanges();
    });
  }

  deleteMemory(id: string) {
    if (confirm('Are you sure you want to delete this knowledge entry?')) {
      this.knowledgeService.delete(id).subscribe({
        next: () => {
          this.loadMemories();
          this.showToast('Knowledge entry deleted.');
        },
        error: () => {
          this.showToast('Error deleting knowledge entry.', 'error');
        }
      });
    }
  }

  deleteAllKnowledge() {
    if (!confirm('Are you sure you want to delete ALL knowledge entries? This cannot be undone.')) return;
    this.isLoadingKnowledge = true;
    this.knowledgeService.deleteAll().subscribe({
      next: () => {
        this.loadMemories();
        this.isLoadingKnowledge = false;
        this.showToast('All knowledge entries deleted.');
      },
      error: () => {
        this.isLoadingKnowledge = false;
        this.showToast('Error deleting knowledge entries.', 'error');
      }
    });
  }

  selectTenant(tenant: any) {
    this.selectedTenant = { ...tenant };
    if (!this.selectedTenant.allowedTools) {
      this.selectedTenant.allowedTools = [];
    }

    this.tenantService.getAvailableTools().subscribe((tools) => {
      this.availableTools = tools;
      this.cdr.detectChanges();
    });

    this.chatService.getAnalytics(this.selectedTenant._id).subscribe((data) => {
      this.analytics = data;
      this.cdr.detectChanges();
    });

    this.loadMemories();

    // Pre-fill account email
    this.accountEmail = tenant.email || '';
  }

  toggleTool(toolId: string) {
    const index = this.selectedTenant.allowedTools.indexOf(toolId);
    if (index > -1) {
      this.selectedTenant.allowedTools.splice(index, 1);
    } else {
      this.selectedTenant.allowedTools.push(toolId);
    }
  }

  openModal(modalName: typeof this.activeModal) {
    this.activeModal = modalName;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.activeModal = null;
    this.cdr.detectChanges();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
  }

  saveTenantChanges() {
    this.isSaving = true;
    const { _id, name, systemPrompt, allowedTools, primaryColor, chatTitle, chatIcon } = this.selectedTenant;

    this.tenantService.updateTenant(_id, { name, systemPrompt, allowedTools, primaryColor, chatTitle, chatIcon }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToast('Agent profile updated successfully!');
        this.loadTenants();
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast('Error saving changes.', 'error');
      }
    });
  }

  saveAccountChanges() {
    if (this.accountNewPassword && this.accountNewPassword !== this.accountNewPasswordConfirm) {
      this.showToast('New passwords do not match.', 'error');
      return;
    }
    if (this.accountNewPassword && !this.accountCurrentPassword) {
      this.showToast('Please enter your current password to change it.', 'warning');
      return;
    }

    this.isSavingAccount = true;
    const payload: any = {};
    if (this.accountEmail && this.accountEmail !== this.selectedTenant.email) {
      payload.email = this.accountEmail;
    }
    if (this.accountNewPassword) {
      payload.currentPassword = this.accountCurrentPassword;
      payload.newPassword = this.accountNewPassword;
    }

    if (Object.keys(payload).length === 0) {
      this.isSavingAccount = false;
      this.closeModal();
      return;
    }

    this.tenantService.updateAccount(this.selectedTenant._id, payload).subscribe({
      next: () => {
        this.isSavingAccount = false;
        this.accountCurrentPassword = '';
        this.accountNewPassword = '';
        this.accountNewPasswordConfirm = '';
        this.showToast('Account updated successfully!');
        this.closeModal();
      },
      error: (err) => {
        this.isSavingAccount = false;
        const message = err.error?.message || 'Error updating account.';
        this.showToast(message, 'error');
      }
    });
  }

  addKnowledge() {
    if (!this.newKnowledgeContent.trim()) return;
    this.isLoadingKnowledge = true;
    this.knowledgeService
      .addKnowledge(this.newKnowledgeContent)
      .subscribe({
        next: () => {
          this.newKnowledgeContent = '';
          this.isLoadingKnowledge = false;
          this.loadMemories();
          this.showToast('Knowledge added successfully!');
        },
        error: () => {
          this.showToast('Error saving knowledge.', 'error');
          this.isLoadingKnowledge = false;
        },
      });
  }

  uploadFile(event: any) {
    const files: File[] = Array.from(event.target.files || []);
    if (files.length === 0) return;
    this.processUploadedFiles(files);
    event.target.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files: File[] = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) this.processUploadedFiles(files);
  }

  private async processUploadedFiles(files: File[]) {
    const allowedTypes = ['application/pdf', 'text/markdown', 'text/plain', 'application/json', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.md', '.txt', '.json', '.csv', '.docx'];

    const validFiles = files.filter(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return allowedTypes.includes(file.type) || allowedExtensions.includes(ext);
    });

    if (validFiles.length === 0) {
      this.showToast('Unsupported format. Supported: PDF, Markdown, TXT, JSON, CSV, DOCX.', 'error');
      return;
    }

    if (validFiles.length < files.length) {
      const skipped = files.length - validFiles.length;
      this.showToast(`${skipped} file(s) skipped (unsupported format). Processing ${validFiles.length} valid file(s).`, 'warning');
    }

    this.isLoadingKnowledge = true;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      this.uploadProgress = `Uploading ${i + 1} of ${validFiles.length}: ${file.name}`;
      this.cdr.detectChanges();

      try {
        await this.knowledgeService.uploadFile(file).toPromise();
        success++;
      } catch {
        failed++;
      }
    }

    this.isLoadingKnowledge = false;
    this.uploadProgress = '';
    this.loadMemories();
    this.cdr.detectChanges();

    if (failed === 0) {
      this.showToast(`All ${success} file(s) processed successfully!`);
    } else {
      this.showToast(`Done: ${success} file(s) processed, ${failed} failed.`, 'warning');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  truncate(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
