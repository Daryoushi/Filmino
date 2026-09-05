"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, BookOpen, Sparkles } from 'lucide-react';

export interface BookPage {
    title?: string;
    backTitle?: string;
    content: React.ReactNode;
    backContent?: React.ReactNode;
    pageNumber: number;
}

export interface InteractiveBookProps {
    coverImage: string;
    bookTitle?: string;
    bookAuthor?: string;
    pages: BookPage[];
    className?: string;
    width?: number | string;
    height?: number | string;
}

export default function InteractiveBook({
    coverImage,
    bookTitle = "Book Title",
    bookAuthor = "Author Name",
    pages,
    className,
    width = 350,
    height = 500,
}: InteractiveBookProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(-1);
    const [isHovering, setIsHovering] = useState(false);

    // Calculate dynamic width/height values for animations
    const widthNum = typeof width === 'number' ? width : 350;

    // Sync container shift with cover open
    const BOOK_OPEN_DURATION = 1.5;
    const EASING: [number, number, number, number] = [0.25, 0, 0, 1]; // milder smoothing

    const handleOpenBook = () => setIsOpen(true);

    const handleCloseBook = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsOpen(false);
        setCurrentPageIndex(-1);
    };

    const nextPage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex((prev) => prev + 1);
        }
    };

    const prevPage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentPageIndex >= 0) {
            setCurrentPageIndex((prev) => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'Escape') handleCloseBook();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentPageIndex]);

    return (
        <div
            className={cn("relative flex flex-col items-center justify-center perspective-[2000px] w-full max-w-full overflow-visible py-6 select-none", className)}
            style={{
                minHeight: typeof height === 'number' ? height + 70 : 480
            }}
        >
            <motion.div
                className="relative preserve-3d"
                style={{ width, height }}
                initial={{ x: 0 }}
                animate={{ x: isOpen ? widthNum / 2 : 0 }}
                transition={{ duration: BOOK_OPEN_DURATION, ease: EASING }}
            >

                {/* Front Cover */}
                <motion.div
                    className="absolute inset-0 w-full h-full origin-left"
                    initial={{ rotateY: 0, zIndex: 100 }}
                    animate={{
                        rotateY: isOpen ? -180 : (isHovering ? -15 : 0),
                        zIndex: isOpen ? 0 : 100
                    }}
                    transition={{
                        rotateY: { duration: BOOK_OPEN_DURATION, ease: EASING },
                        zIndex: { delay: isOpen ? BOOK_OPEN_DURATION * 0.6 : BOOK_OPEN_DURATION * 0.4 }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    onClick={!isOpen ? handleOpenBook : undefined}
                    onHoverStart={() => !isOpen && setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                >
                    {/* Front Face (Closed Book Cover) */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden rounded-r-2xl rounded-l-sm shadow-2xl cursor-pointer overflow-hidden group border border-white/10"
                        style={{ transform: 'translateZ(0.5px)' }}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url(${coverImage})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

                        <div className="absolute bottom-4 left-4 right-4 text-white text-right">
                            <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs border border-amber-500/20 mb-2 inline-block">
                                {bookAuthor}
                            </span>
                            <h1 className="text-base font-bold tracking-wide drop-shadow-md leading-tight text-white">{bookTitle}</h1>
                        </div>

                        {/* Spine Highlight */}
                        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/20 to-transparent opacity-40" />
                        <div className="absolute left-[10px] top-0 bottom-0 w-[1px] bg-black/50" />
                    </div>

                    {/* Back Face (Inner Cover - Left Side of Open Album) */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden rounded-l-2xl rounded-r-none bg-white dark:bg-zinc-900 border-l border-y border-zinc-200 dark:border-zinc-800 shadow-2xl rotate-y-180 flex flex-col p-6 cursor-pointer overflow-hidden text-zinc-900 dark:text-zinc-100"
                        style={{ transform: 'rotateY(180deg) translateZ(0.5px)' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            prevPage();
                        }}
                    >
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-3 shadow-inner">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 tracking-wide">{bookTitle}</h2>
                            <div className="w-8 h-0.5 bg-amber-500/50 rounded-full mb-3" />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">آلبوم تصاویر و پوسترها</p>
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-4 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/50">
                                برای ورق زدن کلیک کنید
                            </span>
                        </div>
                        {/* Crease shadow at spine (right edge) */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 dark:from-black/60 via-black/5 dark:via-black/20 to-transparent pointer-events-none" />
                    </div>
                </motion.div>

                {/* Pages Stack */}
                <div className="absolute inset-0 w-full h-full z-0" style={{ transformStyle: 'preserve-3d' }}>
                    {pages.map((page, index) => {
                        const isFlipped = index <= currentPageIndex;

                        return (
                            <motion.div
                                key={index}
                                className="absolute inset-0 w-full h-full origin-left"
                                style={{ transformStyle: 'preserve-3d' }}
                                initial={{ rotateY: 0, zIndex: pages.length - index }}
                                animate={{
                                    rotateY: isFlipped ? -180 : 0,
                                    zIndex: isFlipped ? index + 1 : pages.length - index
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.645, 0.045, 0.355, 1]
                                }}
                            >
                                {/* Front Face (Right Side of Open Album) */}
                                <div
                                    className="absolute inset-0 w-full h-full backface-hidden rounded-r-2xl rounded-l-none overflow-hidden p-2 sm:p-2.5 flex flex-col bg-white dark:bg-zinc-900 border-r border-y border-zinc-200 dark:border-zinc-800 shadow-xl cursor-pointer text-zinc-900 dark:text-zinc-100"
                                    style={{ transform: 'translateZ(0.5px)' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextPage();
                                    }}
                                >
                                    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden select-none">
                                        <div className="flex items-center justify-start text-xs px-2 mb-1 font-sans">
                                            <span className="font-mono text-xs font-medium text-zinc-400 dark:text-zinc-500 select-none">
                                                {page.pageNumber * 2 - 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 w-full h-full min-h-0 overflow-hidden">
                                            {page.content}
                                        </div>
                                    </div>
                                    {/* Crease shadow at spine (left edge) */}
                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 dark:from-black/60 via-black/5 dark:via-black/20 to-transparent pointer-events-none z-10" />
                                </div>

                                {/* Back Face (Left Side of Open Album when flipped) */}
                                <div
                                    className="absolute inset-0 w-full h-full backface-hidden rounded-l-2xl rounded-r-none rotate-y-180 bg-white dark:bg-zinc-900 border-l border-y border-zinc-200 dark:border-zinc-800 overflow-hidden p-2 sm:p-2.5 flex flex-col cursor-pointer shadow-xl text-zinc-900 dark:text-zinc-100"
                                    style={{ transform: 'rotateY(180deg) translateZ(0.5px)' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevPage();
                                    }}
                                >
                                    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden select-none">
                                        <div className="flex items-center justify-end text-xs px-2 mb-1 font-sans">
                                            <span className="font-mono text-xs font-medium text-zinc-400 dark:text-zinc-500 select-none">
                                                {page.pageNumber * 2}
                                            </span>
                                        </div>
                                        <div className="flex-1 w-full h-full min-h-0 overflow-hidden">
                                            {page.backContent || page.content}
                                        </div>
                                    </div>
                                    {/* Crease shadow at spine (right edge) */}
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/15 dark:from-black/60 via-black/5 dark:via-black/20 to-transparent pointer-events-none z-10" />
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Back Cover (Static - Right Side when finished) */}
                    <div
                        className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-r-2xl rounded-l-none shadow-xl border-r border-y border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        style={{ transform: 'translateZ(-1px)', zIndex: -1 }}
                    >
                        <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center opacity-90">
                            <BookOpen className="h-8 w-8 text-amber-500 mb-2" />
                            <p className="font-bold text-zinc-900 dark:text-zinc-200 text-base">پایان آلبوم</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">تمام تصاویر مشاهده شد</p>
                        </div>
                        {/* Crease shadow at spine (left edge) */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 dark:from-black/60 via-black/5 dark:via-black/20 to-transparent pointer-events-none" />
                    </div>
                </div>

            </motion.div>

            {/* Side Navigation Controls & Close Button */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleCloseBook}
                            className="absolute top-2 right-4 p-2 rounded-full bg-white/95 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 shadow-xl backdrop-blur-sm transition-all hover:scale-110 z-[1000] cursor-pointer"
                            title="بستن آلبوم"
                        >
                            <X size={20} />
                        </motion.button>

                        {/* Prev Page Button (Right side in RTL) */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={prevPage}
                            disabled={currentPageIndex < 0}
                            className={cn(
                                "absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white shadow-xl backdrop-blur-sm transition-all z-[1000] cursor-pointer hover:scale-110",
                                currentPageIndex < 0 && "opacity-30 cursor-not-allowed hover:scale-100"
                            )}
                            title="صفحه قبلی"
                        >
                            <ChevronRight size={22} />
                        </motion.button>

                        {/* Next Page Button (Left side in RTL) */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={nextPage}
                            disabled={currentPageIndex >= pages.length - 1}
                            className={cn(
                                "absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white shadow-xl backdrop-blur-sm transition-all z-[1000] cursor-pointer hover:scale-110",
                                currentPageIndex >= pages.length - 1 && "opacity-30 cursor-not-allowed hover:scale-100"
                            )}
                            title="صفحه بعدی"
                        >
                            <ChevronLeft size={22} />
                        </motion.button>
                    </>
                )}
            </AnimatePresence>

            {/* Hint when closed */}
            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="absolute bottom-2 text-amber-600 dark:text-amber-400 font-bold text-xs tracking-wider cursor-pointer z-50 transition-colors bg-white/95 dark:bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/60 backdrop-blur-xs shadow-md"
                    onClick={handleOpenBook}
                >
                    📖 برای ورق‌زدن آلبوم کلیک کنید
                </motion.div>
            )}
        </div>
    );
}

export { InteractiveBook };
