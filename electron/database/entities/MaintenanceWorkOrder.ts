import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MaintenanceWorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string;

  @Column()
  deviceCode: string;

  @Column()
  workType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  spareParts: string;

  @Column()
  priority: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  assignedTeam: string;

  @Column({ nullable: true })
  assignee: string;

  @Column({ nullable: true })
  plannedDate: string;

  @Column({ nullable: true })
  completedDate: string;

  @Column({ type: 'real', default: 0 })
  laborHours: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
