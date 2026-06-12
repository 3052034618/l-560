import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MaintenancePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceCode: string;

  @Column()
  planType: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  plannedStartDate: string;

  @Column()
  plannedEndDate: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  assignedTeam: string;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
