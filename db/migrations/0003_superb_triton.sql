ALTER TABLE `gifts` ADD `box_config` text DEFAULT '{"color":"rose","ribbon":"champagne","initials":""}' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `reviewed_at` integer;