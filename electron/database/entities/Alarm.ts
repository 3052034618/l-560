import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceCode: string;

  @Column()
  parameter: string;

  @Column()
  alarmLevel: string;

  @Column({ type: 'real' })
  thresholdValue: number;

  @Column({ type: 'real' })
  actualValue: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ nullable: true })
  acknowledgedAt: string;

  @Column({ nullable: true, type: 'text' })
  actionTaken: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
