import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { InsightCard } from "@/lib/types"

const tone = {
  violet: "border-primary/40 shadow-[0_0_30px_rgba(123,77,255,0.15)]",
  magenta: "border-fuchsia-400/40 shadow-[0_0_30px_rgba(240,79,140,0.2)]",
  teal: "border-cyan-300/40 shadow-[0_0_30px_rgba(78,224,226,0.16)]",
  lime: "border-lime-300/40 shadow-[0_0_30px_rgba(160,255,128,0.12)]",
  blue: "border-blue-300/40 shadow-[0_0_30px_rgba(114,170,255,0.15)]",
} as const

export function InsightGrid({ items }: { items: InsightCard[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.07, duration: 0.35 }}
        >
          <Card className={cn("bg-card/80", tone[item.color])}>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{item.title}</span>
                <Badge variant="outline" className="border-border bg-background/60 text-[10px] uppercase">
                  {item.category}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {item.points.map((point) => (
                  <li key={point} className="border-l-2 border-primary/30 pl-3">
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </section>
  )
}
