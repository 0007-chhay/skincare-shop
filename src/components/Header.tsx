import Link from "next/link";
import { site } from "@/lib/site";
import { MenuIcon, SearchIcon } from "./icons";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-mint/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <button aria-label="ម៉ឺនុយ" className="grid size-11 place-items-center rounded-full hover:bg-white">
          <MenuIcon className="size-6" />
        </button>
        <Link href="/" className="font-display text-[22px] font-bold">
          {site.name}
        </Link>
        <button aria-label="ស្វែងរក" className="grid size-11 place-items-center rounded-full hover:bg-white">
          <SearchIcon className="size-6" />
        </button>
      </div>
    </header>
  );
}
