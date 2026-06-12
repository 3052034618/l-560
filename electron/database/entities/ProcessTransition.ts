import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ProcessTransition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fromType: string;

  @Column()
  toType: string;

  @Column({ type: 'real' })
  transitionHours: number;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
