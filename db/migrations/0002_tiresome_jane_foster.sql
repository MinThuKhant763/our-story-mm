CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `gifts` ADD `reveal_at` integer;--> statement-breakpoint
ALTER TABLE `gifts` ADD `voice_id` text;