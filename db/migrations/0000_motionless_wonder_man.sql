CREATE TABLE `audits` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`token` text NOT NULL,
	`content` text NOT NULL,
	`template` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`pin_hash` text,
	`expires_at` integer,
	`paid_order_id` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gifts_token_unique` ON `gifts` (`token`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`reference` text NOT NULL,
	`amount` integer NOT NULL,
	`plan` text NOT NULL,
	`method` text NOT NULL,
	`proof_key` text NOT NULL,
	`proof_mime` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`approved_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_unique` ON `orders` (`reference`);--> statement-breakpoint
CREATE TABLE `pin_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`config` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `viewer_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`gift_id` text NOT NULL,
	`revision` integer NOT NULL,
	`expires_at` integer NOT NULL
);
