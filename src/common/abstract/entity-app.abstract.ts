import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Use for hidden all unnecessary column abstract when select all
 */
export abstract class AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdOnDate: Date;

  @Column({ nullable: true, select: false })
  createdByUserId: string;

  @UpdateDateColumn({ select: false })
  lastModifiedOnDate: Date;

  @Column({ nullable: true, select: false })
  lastModifiedByUserId: string;

  @DeleteDateColumn({ select: false })
  deletedAt: Date;
}
