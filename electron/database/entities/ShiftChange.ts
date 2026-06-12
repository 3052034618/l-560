import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ShiftChange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shiftId: number;

  @Column()
  requester: string;

  @Column()
  requestedSwapWith: string;

  @Column()
  reason: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
