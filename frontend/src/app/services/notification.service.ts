import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';
import { BehaviorSubject, filter } from 'rxjs';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase: SupabaseClient;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Wait for user to be logged in before subscribing
    this.authService.currentUser$
      .pipe(filter(user => !!user))
      .subscribe(user => {
        if (user && user.id) {
          this.subscribeToNotifications(user.id);
        }
      });
  }

  private subscribeToNotifications(userId: number) {
    console.log(`[NotificationService] Subscribing to notifications for user ${userId}`);
    
    this.supabase
      .channel(`user-notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, payload => {
        this.handleNewNotification(payload.new as Notification);
      })
      .subscribe((status) => {
        console.log(`[NotificationService] Subscription status: ${status}`);
      });
  }

  private handleNewNotification(notification: Notification) {
    console.log('[NotificationService] New notification received:', notification);
    
    // Show toast
    this.toastr.info(notification.message, notification.title, {
      timeOut: 8000,
      closeButton: true,
      enableHtml: true,
      progressBar: true
    });

    // Update local state
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
  }

  async markAsRead(notificationId: number) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
      
    if (!error) {
      const current = this.notificationsSubject.value.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.notificationsSubject.next(current);
    }
  }
}
