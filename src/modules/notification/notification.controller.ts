import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationService, PaginatedNotificationResponse } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new notification' })
    @ApiResponse({ status: 201, description: 'Notification created successfully' })
    create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
        return this.notificationService.create(createNotificationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all notifications with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<PaginatedNotificationResponse<Notification>> {
        return this.notificationService.findAll(page, limit);
    }

    @Get('unread')
    @ApiOperation({ summary: 'Get unread notifications' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
    @ApiResponse({ status: 200, description: 'Unread notifications retrieved successfully' })
    findUnread(@Query('limit') limit?: number): Promise<Notification[]> {
        return this.notificationService.findUnread(limit);
    }

    @Get('type/:type')
    @ApiOperation({ summary: 'Get notifications by type' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
    @ApiResponse({ status: 200, description: 'Notifications by type retrieved successfully' })
    findByType(@Param('type') type: string, @Query('limit') limit?: number): Promise<Notification[]> {
        return this.notificationService.findByType(type, limit);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    markAllAsRead(): Promise<void> {
        return this.notificationService.markAllAsRead();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get notification by ID' })
    @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    findOne(@Param('id') id: string): Promise<Notification> {
        return this.notificationService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update notification' })
    @ApiResponse({ status: 200, description: 'Notification updated successfully' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
        return this.notificationService.update(id, updateNotificationDto);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    markAsRead(@Param('id') id: string): Promise<Notification> {
        return this.notificationService.markAsRead(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    remove(@Param('id') id: string): Promise<void> {
        return this.notificationService.remove(id);
    }

    @Delete('cleanup/:days')
    @ApiOperation({ summary: 'Delete old notifications' })
    @ApiResponse({ status: 200, description: 'Old notifications deleted successfully' })
    deleteOldNotifications(@Param('days') days: string): Promise<number> {
        return this.notificationService.deleteOldNotifications(+days);
    }
}
