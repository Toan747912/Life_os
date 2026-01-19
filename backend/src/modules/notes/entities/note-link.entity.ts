import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('note_links')
export class NoteLink {
  @PrimaryColumn({ name: 'source_note_id' })
  sourceNoteId: string;

  @PrimaryColumn({ name: 'target_note_id' })
  targetNoteId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Note, (note) => note.outgoingLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_note_id' })
  sourceNote: Note;

  @ManyToOne(() => Note, (note) => note.incomingLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_note_id' })
  targetNote: Note;
}
