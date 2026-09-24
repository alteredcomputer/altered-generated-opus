DROP INDEX "events_person_created_idx";--> statement-breakpoint
DROP INDEX "messages_person_created_idx";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "seq" bigint NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "events_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "seq" bigint NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "messages_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
CREATE INDEX "events_person_seq_idx" ON "events" USING btree ("person_id","seq");--> statement-breakpoint
CREATE INDEX "messages_person_seq_idx" ON "messages" USING btree ("person_id","seq");