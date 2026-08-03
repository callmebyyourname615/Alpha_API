import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { StudentLinkRequestStatus } from './student-link-request.entity';
import { StudentLinkRequestsService } from './student-link-request.service';

@Controller('student-link-requests')
export class StudentLinkRequestsController {
  constructor(private readonly service: StudentLinkRequestsService) {}

  /** POST /student-link-requests — parent scanned a student's QR code. */
  @Post()
  create(@Body() body: { studentId: string; parentId: string }) {
    return this.service.create(body);
  }

  /** GET /student-link-requests?status=pending — admin review queue. */
  @Get()
  findPending(@Query('status') status?: string) {
    if (status && status !== 'pending') {
      return [];
    }
    return this.service.findPending();
  }

  /**
   * GET /student-link-requests/status?parentId=&studentId=
   * Lets the scanning parent's app poll the outcome of its own request.
   */
  @Get('status')
  findLatest(
    @Query('parentId') parentId: string,
    @Query('studentId') studentId: string,
  ) {
    return this.service.findLatestForParentAndStudent(parentId, studentId);
  }

  /** GET /student-link-requests/parent/:parentId?status=pending */
  @Get('parent/:parentId')
  findForParent(
    @Param('parentId') parentId: string,
    @Query('status') status?: StudentLinkRequestStatus,
  ) {
    return this.service.findForParent(parentId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** PATCH /student-link-requests/:id/approve */
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body('reviewerId') reviewerId?: string) {
    return this.service.approve(id, reviewerId);
  }

  /** PATCH /student-link-requests/:id/reject */
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body('reviewerId') reviewerId?: string,
    @Body('reason') reason?: string,
  ) {
    return this.service.reject(id, reviewerId, reason);
  }
}
