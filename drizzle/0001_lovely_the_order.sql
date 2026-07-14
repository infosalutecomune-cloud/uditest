CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(128),
	`cognome` varchar(128),
	`email` varchar(320) NOT NULL,
	`cellulare` varchar(32),
	`consensoPrivacy` boolean NOT NULL DEFAULT false,
	`consensoMarketing` boolean NOT NULL DEFAULT false,
	`tipoTest` varchar(32),
	`risultatoSintetico` text,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
