CREATE TABLE "areas" (
	"area_code" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"bls_name" text NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cpi" (
	"year" integer NOT NULL,
	"month" smallint,
	"value" double precision NOT NULL,
	"is_provisional" boolean DEFAULT false NOT NULL,
	"provisional_note" text,
	CONSTRAINT "cpi_period_key" UNIQUE NULLS NOT DISTINCT("year","month")
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingest_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"series_id" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"rows_written" integer NOT NULL,
	"fetched_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"item_code" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"label_attributive" text NOT NULL,
	"unit" text NOT NULL,
	"category" text NOT NULL,
	"group" text DEFAULT '' NOT NULL,
	"bls_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"series_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	"value" double precision NOT NULL,
	CONSTRAINT "prices_series_period_key" UNIQUE("series_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "series" (
	"series_id" text PRIMARY KEY NOT NULL,
	"item_code" text NOT NULL,
	"area_code" text NOT NULL,
	"begin_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"is_discontinued" boolean DEFAULT false NOT NULL,
	CONSTRAINT "series_item_area_key" UNIQUE("item_code","area_code")
);
--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_series_id_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_item_code_items_item_code_fk" FOREIGN KEY ("item_code") REFERENCES "public"."items"("item_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_area_code_areas_area_code_fk" FOREIGN KEY ("area_code") REFERENCES "public"."areas"("area_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prices_series_year_idx" ON "prices" USING btree ("series_id","year");--> statement-breakpoint
CREATE INDEX "series_item_idx" ON "series" USING btree ("item_code");--> statement-breakpoint
CREATE INDEX "series_area_idx" ON "series" USING btree ("area_code");