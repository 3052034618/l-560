import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ScheduleApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  scheduleId: number;

  @Column()
  approver: string;

  @Column()
  approvalType: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ nullable: true })
  approvedAt: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
