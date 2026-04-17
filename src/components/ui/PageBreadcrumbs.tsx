import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItemDef {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItemDef[];
  className?: string;
}

const PageBreadcrumbs = ({ items, className }: PageBreadcrumbsProps) => {
  // Mobile: collapse middle items if there are more than 3
  const showEllipsis = items.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Mobile collapsed view */}
          {showEllipsis && (
            <>
              <BreadcrumbSeparator className="sm:hidden" />
              <BreadcrumbItem className="sm:hidden">
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="sm:hidden" />
              <BreadcrumbItem className="sm:hidden">
                <BreadcrumbPage className="truncate max-w-[140px]">
                  {items[items.length - 1].label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          {/* Desktop full view (or full view when ≤3 items) */}
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const hideOnMobile = showEllipsis;
            return (
              <Fragment key={`${item.label}-${idx}`}>
                <BreadcrumbSeparator className={hideOnMobile ? "hidden sm:block" : ""} />
                <BreadcrumbItem className={hideOnMobile ? "hidden sm:flex" : ""}>
                  {isLast || !item.href ? (
                    <BreadcrumbPage className="truncate max-w-[180px]">{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href} className="hover:text-primary transition-colors">
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
};

export default PageBreadcrumbs;
