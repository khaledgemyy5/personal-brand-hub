import { useEffect, useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { getWritingCategories, getWritingItems, trackEvent } from "@/lib/db";
import type { WritingCategory, WritingListItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function Writing() {
  const [categories, setCategories] = useState<WritingCategory[]>([]);
  const [items, setItems] = useState<WritingListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, WritingListItem[]> = {};

    // Initialize groups for each category
    categories.forEach((cat) => {
      groups[cat.id] = [];
    });

    // Add uncategorized group
    groups["uncategorized"] = [];

    // Assign items to groups
    items.forEach((item) => {
      const key = item.category_name
        ? categories.find((c) => c.name === item.category_name)?.id || "uncategorized"
        : "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [categories, items]);

  // Order categories by order_index, uncategorized last
  const orderedCategoryIds = useMemo(() => {
    const catIds = categories
      .sort((a, b) => a.order_index - b.order_index)
      .map((c) => c.id);

    // Add uncategorized at the end if it has items
    if (groupedItems["uncategorized"]?.length > 0) {
      catIds.push("uncategorized");
    }

    return catIds.filter((id) => groupedItems[id]?.length > 0);
  }, [categories, groupedItems]);

  const handleItemClick = (item: WritingListItem) => {
    trackEvent({ event: "writing_click", path: item.url });
  };

  const getCategoryName = (id: string) => {
    if (id === "uncategorized") return "Uncategorized";
    return categories.find((c) => c.id === id)?.name || "Uncategorized";
  };

  if (loading) {
    return (
      <div className="container-narrow section-spacing">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-5 w-96 mb-12" />
        <div className="space-y-8">
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <WritingItemSkeleton />
              <WritingItemSkeleton />
            </div>
          </div>
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

        <div className="container-narrow section-spacing">
          <h1 className="mb-4">Writing</h1>
          <p className="text-muted-foreground">
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

      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Writing</h1>
        <p className="text-muted-foreground mb-12">
          Selected articles and essays. All links point to external publications.
        </p>

        <div className="space-y-12">
          {orderedCategoryIds.map((categoryId) => (
            <section key={categoryId}>
              <h2 className="text-lg font-medium mb-6 text-foreground">
                {getCategoryName(categoryId)}
              </h2>
              <div className="space-y-4">
                {groupedItems[categoryId].map((item) => (
                  <WritingItem
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </section>
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

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="block p-4 -mx-4 rounded-lg card-hover border border-transparent hover:border-border group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium group-hover:text-accent transition-colors"
            dir={isArabic ? 'rtl' : 'ltr'}
            lang={isArabic ? 'ar' : undefined}
          >
            {item.title}
          </h3>
          {showWhy && (
            <p 
              className="text-sm text-muted-foreground mt-1" 
              dir={isArabic ? 'rtl' : 'ltr'}
              lang={isArabic ? 'ar' : undefined}
            >
              {item.why_this_matters}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground">
          <span>{item.platform_label}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}

function WritingItemSkeleton() {
  return (
    <div className="p-4 -mx-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
