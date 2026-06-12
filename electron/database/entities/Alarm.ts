import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  alarmCode: string;

  @Column()
  deviceCode: string;

  @Column()
  parameter: string;

  @Column({ nullable: true })
  parameterKey: string;

  @Column()
  alarmLevel: string;

  @Column({ type: 'text', nullable: true })
  thresholdValue: string;

  @Column({ type: 'real' })
  actualValue: number;

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

  @Column({ nullable: true })
  actionType: string;

  @Column({ nullable: true, type: 'text' })
  actionDetail: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
