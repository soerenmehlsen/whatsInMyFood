import { IngredientItem } from "@/app/components/ImageUploader";
import { motion } from "framer-motion";
import { useState } from "react";
import { Tooltip } from "@mui/material";

interface IngredientGridProps {
  items: IngredientItem[];
}

export function IngredientGrid({ items }: IngredientGridProps) {
  const [expandItem, setExpandItem] = useState<string | null>(null);

  const handleExpand = (itemName: string) => {
    setExpandItem((prev) => (prev === itemName ? null : itemName));
  };

  const novaLabelsColor = (novaClassification: number) => {
    switch (novaClassification) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const shortNovaLabel = (novaClassification: number) => {
    switch (novaClassification) {
      case 1:
        return "NOVA 1";
      case 2:
        return "NOVA 2";
      case 3:
        return "NOVA 3";
      case 4:
        return "NOVA 4";
      default:
        return "Unknown NOVA";
    }
  };

  const NovaInfo = (novaClassification: number) => {
    switch (novaClassification) {
      case 1:
        return "1. Unprocessed or minimally processed foods";
      case 2:
        return "2. Processed culinary ingredients";
      case 3:
        return "3. Processed foods";
      case 4:
        return "4. Ultra-processed foods";
      default:
        return "Unknown NOVA";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <motion.div
          key={item.name}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-white rounded-lg shadow-md overflow-hidden${
            expandItem === item.name ? "shadow-lg" : "shadow-md"
          } hover:shadow-lg hover:scale-125 transition-transform duration-300`}
          onClick={() => handleExpand(item.name)}
        >
          <div className="p-4 relative pt-2 sm:pt-8">
            <h3 className="text-lg font-semibold mb-1">{item.name}</h3>

            <Tooltip title={NovaInfo(Number(item.nova_classification))}>
              <span
                className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${novaLabelsColor(
                  Number(item.nova_classification),
                )}`}
              >
                {shortNovaLabel(Number(item.nova_classification))}
              </span>
            </Tooltip>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: expandItem === item.name ? 1 : 0.7 }}
              className={`text-sm text-gray-500 ${expandItem === item.name ? "line-clamp-none" : "line-clamp-2"}`}
            >
              {item.description}
              <br />
              <span className="font-bold">Process: </span>
              {item.reason}
            </motion.p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
