import { useState } from "react";

const IMG = "https://images.unsplash.com/";
const Q = "?w=800&h=500&fit=crop&auto=format";

function unsplashFallback(title: string): string {
  if (title.includes("義大利麵") || title.includes("波納拉")) return IMG + "photo-1556761223-4c4282c73f77" + Q;
  if (title.includes("堡") || title.includes("三明治") || title.includes("BLT") || title.includes("法式吐司")) return IMG + "photo-1568901346375-23c9450c58cd" + Q;
  if (title.includes("玉子燒")) return IMG + "photo-1680137248903-7af5d51a3350" + Q;
  if (title.includes("湯") || title.includes("火鍋") || title.includes("粥") || title.includes("薑母鴨") || title.includes("麻油雞")) return IMG + "photo-1665593998976-d957f2827fe7" + Q;
  if (title.includes("炒飯") || title.includes("咖哩")) return IMG + "photo-1603133872878-684f208fb84b" + Q;
  if (title.includes("麵") || title.includes("炒米粉")) return IMG + "photo-1631709497146-a239ef373cf1" + Q;
  if (title.includes("蚵仔煎") || title.includes("清蒸魚") || title.includes("蝦仁") || title.includes("蛤蜊")) return IMG + "photo-1664774367243-18caa521fb96" + Q;
  if (title.includes("豆腐") || title.includes("皮蛋")) return IMG + "photo-1596352670192-5a95e357df7b" + Q;
  if (title.includes("滷") || title.includes("紅燒") || title.includes("梅干") || title.includes("豉汁") || title.includes("三杯")) return IMG + "photo-1625477811233-044633d10dd1" + Q;
  if (title.includes("炸") || title.includes("雞排") || title.includes("鹽酥") || title.includes("苦瓜釀") || title.includes("糖醋")) return IMG + "photo-1652209898504-ea7f96b44580" + Q;
  if (title.includes("蒸蛋") || title.includes("炒蛋") || title.includes("煎蛋") || title.includes("菜脯蛋") || title.includes("滷蛋")) return IMG + "photo-1629180052394-bedb0e4445fd" + Q;
  if (title.includes("空心菜") || title.includes("高麗菜") || title.includes("地瓜葉") || title.includes("豆芽") || title.includes("茄子") || title.includes("金針菇")) return IMG + "photo-1599297915779-0dadbd376d49" + Q;
  return IMG + "photo-1564834724105-918b73d1b9e0" + Q;
}

interface Props {
  src: string | null | undefined;
  title: string;
  imgClassName: string;
  placeholderClassName: string;
  placeholderStyle?: React.CSSProperties;
}

export function RecipeImage({ src, title, imgClassName, placeholderClassName, placeholderStyle }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(src ?? null);
  const [usedFallback, setUsedFallback] = useState(false);

  if (!imgSrc) {
    return (
      <div className={placeholderClassName} style={placeholderStyle}>
        🍽️
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title}
      className={imgClassName}
      onError={() => {
        if (!usedFallback) {
          setUsedFallback(true);
          setImgSrc(unsplashFallback(title));
        } else {
          setImgSrc(null);
        }
      }}
    />
  );
}
