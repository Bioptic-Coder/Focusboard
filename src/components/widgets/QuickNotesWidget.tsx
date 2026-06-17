import React, { useState } from "react";

export const QuickNotesWidget: React.FC = () => {
  const [text, setText] = useState<string>(() => {
    return localStorage.getItem("deskdash-quicknotes") || "";
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    localStorage.setItem("deskdash-quicknotes", newVal);
  };

  return (
    <div className="w-full h-full flex flex-col p-1 select-none">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type quick notes, lists, or reminders here. Content auto-saves..."
        className="w-full h-full p-3 bg-black/30 border border-[var(--color-card-border)] rounded-xl text-base text-[var(--color-text-main)] placeholder-zinc-500 font-sans resize-none focus:bg-black/50 transition-colors focus:outline-none accessible-focus"
        aria-label="Quick notes notepad. Auto-saving"
      />
    </div>
  );
};
