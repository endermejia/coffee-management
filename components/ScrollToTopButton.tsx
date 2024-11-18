import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!showScrollToTop) {
    return null;
  }

  return (
    <Button
      className="fixed top-4 right-4 rounded-full p-3 transition-opacity duration-300 z-50"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ChevronsUp className="h-6 w-6" />
    </Button>
  );
};

export default ScrollToTopButton;
