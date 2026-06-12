import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  department: string;

  @Column({ type: 'text' })
  skills: string;

  @Column({ type: 'real' })
  maxWorkHoursPerWeek: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
