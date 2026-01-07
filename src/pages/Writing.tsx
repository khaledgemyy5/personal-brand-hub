import { useEffect, useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { getWritingCategories, getWritingItems, trackEvent } from "@/lib/db";
import type { WritingCategory, WritingListItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function Writing() {
  const [categories, setCategories] = useState<WritingCategory[]>([]);
  const [items, setItems] = useState<WritingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [categoriesRes, itemsRes] = await Promise.all([
        getWritingCategories(),
        getWritingItems(),
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (itemsRes.data) {
        setItems(itemsRes.data);
      }

      setLoading(false);
    }

    loadData();
    trackEvent({ event: "page_view", path: "/writing" });
  }, []);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter(item => item.category_name === selectedCategory);
  }, [items, selectedCategory]);

  // Unique category names
  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach(item => {
      if (item.category_name) names.add(item.category_name);
    });
    return Array.from(names);
  }, [items]);

  const handleItemClick = (item: WritingListItem) => {
    trackEvent({ event: "writing_click", path: item.url });
  };

  if (loading) {
    return (
      <div className="container-narrow py-16 md:py-24">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-5 w-96 mb-12" />
        <div className="space-y-4">
          <WritingItemSkeleton />
          <WritingItemSkeleton />
          <WritingItemSkeleton />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <title>Writing - Ammar</title>
        <meta
          name="description"
          content="Selected writing and articles by Ammar. Thoughts on software engineering, product development, and technology."
        />

        <div className="container-narrow py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Writing</h1>
          <p className="text-lg text-muted-foreground">
            No writing published yet. Check back soon.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Writing - Ammar</title>
      <meta
        name="description"
        content="Selected writing and articles by Ammar. Thoughts on software engineering, product development, and technology."
      />

      <div className="container-narrow py-16 md:py-24">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Writing</h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Selected articles and essays. All links point to external publications.
          </p>
        </header>

        {/* Category filter pills */}
        {categoryNames.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm rounded-full border transition-all ${
                selectedCategory === null
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  selectedCategory === name
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Writing list */}
        <div className="divide-y divide-border">
          {filteredItems.map((item) => (
            <WritingItem
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function WritingItem({
  item,
  onClick,
}: {
  item: WritingListItem;
  onClick: () => void;
}) {
  const showWhy = item.show_why && item.why_this_matters;
  const isArabic = item.language === 'AR';
  const [whyOpen, setWhyOpen] = useState(false);

  if (showWhy) {
    return (
      <Collapsible open={whyOpen} onOpenChange={setWhyOpen} className="py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                className="font-medium hover:text-accent transition-colors"
                dir={isArabic ? 'rtl' : 'ltr'}
                lang={isArabic ? 'ar' : undefined}
              >
                {item.title}
              </a>
              {isArabic && (
                <Badge variant="outline" className="shrink-0 text-xs">AR</Badge>
              )}
            </div>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${whyOpen ? 'rotate-180' : ''}`} />
              Why this matters
            </CollapsibleTrigger>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{item.platform_label}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <CollapsibleContent className="pt-3">
          <p 
            className="text-sm text-muted-foreground pl-5 border-l-2 border-border"
            dir={isArabic ? 'rtl' : 'ltr'}
            lang={isArabic ? 'ar' : undefined}
          >
            {item.why_this_matters}
          </p>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center justify-between gap-4 py-5 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-medium group-hover:text-accent transition-colors"
          dir={isArabic ? 'rtl' : 'ltr'}
          lang={isArabic ? 'ar' : undefined}
        >
          {item.title}
        </span>
        {isArabic && (
          <Badge variant="outline" className="shrink-0 text-xs">AR</Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        <span>{item.platform_label}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}

function WritingItemSkeleton() {
  return (
    <div className="py-5">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
