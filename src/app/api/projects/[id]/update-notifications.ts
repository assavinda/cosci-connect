// src/app/api/projects/[id]/update-notifications.ts
// Helper functions for project status change notifications

import { 
    sendProjectStatusNotification, 
    sendProjectRequestNotification, 
    sendProjectInvitationNotification
  } from '@/libs/notification-helpers';
  import User from '@/models/User';
  
  // Function to send notifications when a project's status changes
  export async function handleProjectStatusChange(
    projectId: string,
    oldStatus: string,
    newStatus: string,
    ownerId: string,
    freelancerId?: string,
    projectTitle?: string
  ) {
    // Always notify about status changes
    await sendProjectStatusNotification(
      projectId,
      newStatus,
      ownerId,
      freelancerId,
      projectTitle
    );
    
    // Additional notifications for specific status transitions
    if (oldStatus === 'open' && newStatus === 'in_progress') {
      // Project was just accepted - send special notification
      try {
        // Get the names of the owner and freelancer for better notifications
        const owner = await User.findById(ownerId).select('name').lean();
        const freelancer = freelancerId ? 
          await User.findById(freelancerId).select('name').lean() : null;
        
        // If project just started and there's a freelancer, notify them with a welcome message
        if (freelancerId && freelancer) {
          await sendNotificationToUser(
            freelancerId,
            'project_accepted',
            'โปรเจกต์เริ่มแล้ว!',
            `คุณได้รับงานโปรเจกต์ "${projectTitle || 'โปรเจกต์'}" จาก ${owner?.name || 'เจ้าของโปรเจกต์'}`,
            {
              projectId,
              projectTitle,
              userId: ownerId,
              userName: owner?.name
            }
          );
        }
        
        // Notify the owner that the project has been accepted by the freelancer
        if (freelancer) {
          await sendNotificationToUser(
            ownerId,
            'project_accepted',
            'มีฟรีแลนซ์รับงานแล้ว!',
            `${freelancer.name || 'ฟรีแลนซ์'} ได้รับงานในโปรเจกต์ "${projectTitle || 'โปรเจกต์'}" ของคุณแล้ว`,
            {
              projectId,
              projectTitle,
              userId: freelancerId,
              userName: freelancer.name
            }
          );
        }
      } catch (error) {
        console.error('Error sending project acceptance notifications:', error);
      }
    } else if (oldStatus !== 'completed' && newStatus === 'completed') {
      // Project was just completed - send special notification
      try {
        // Get the names of the owner and freelancer for better notifications
        const owner = await User.findById(ownerId).select('name').lean();
        const freelancer = freelancerId ? 
          await User.findById(freelancerId).select('name').lean() : null;
        
        // Notify both parties about project completion
        if (freelancerId && freelancer) {
          await sendNotificationToUser(
            freelancerId,
            'project_completed',
            'โปรเจกต์เสร็จสมบูรณ์!',
            `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" ได้รับการยืนยันว่าเสร็จสมบูรณ์แล้ว`,
            {
              projectId,
              projectTitle,
              userId: ownerId,
              userName: owner?.name
            }
          );
        }
        
        await sendNotificationToUser(
          ownerId,
          'project_completed',
          'โปรเจกต์เสร็จสมบูรณ์!',
          `โปรเจกต์ "${projectTitle || 'โปรเจกต์'}" ได้รับการยืนยันว่าเสร็จสมบูรณ์แล้ว`,
          {
            projectId,
            projectTitle,
            userId: freelancerId,
            userName: freelancer?.name
          }
        );
      } catch (error) {
        console.error('Error sending project completion notifications:', error);
      }
    }
    
    return true;
  }
  
  // Function to handle freelancer request to join a project
  export async function handleFreelancerRequest(
    projectId: string,
    projectTitle: string,
    ownerId: string,
    freelancerId: string
  ) {
    try {
      // Get freelancer's name
      const freelancer = await User.findById(freelancerId).select('name').lean();
      
      if (!freelancer) {
        throw new Error('Freelancer not found');
      }
      
      // Send notification to project owner
      await sendProjectRequestNotification(
        ownerId,
        projectId,
        projectTitle,
        freelancerId,
        freelancer.name
      );
      
      return true;
    } catch (error) {
      console.error('Error handling freelancer request:', error);
      return false;
    }
  }
  
  // Function to handle project owner's invitation to a freelancer
  export async function handleProjectInvitation(
    projectId: string,
    projectTitle: string,
    ownerId: string,
    freelancerId: string
  ) {
    try {
      // Get owner's name
      const owner = await User.findById(ownerId).select('name').lean();
      
      if (!owner) {
        throw new Error('Project owner not found');
      }
      
      // Send notification to freelancer
      await sendProjectInvitationNotification(
        freelancerId,
        projectId,
        projectTitle,
        ownerId,
        owner.name
      );
      
      return true;
    } catch (error) {
      console.error('Error handling project invitation:', error);
      return false;
    }
  }
  
  // Import needed at the end to avoid circular dependencies
  import { sendNotificationToUser } from '@/libs/notification-helpers';