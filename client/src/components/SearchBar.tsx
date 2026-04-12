type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      placeholder="Search by title or assignee..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="search-bar"
      aria-label="Search tasks"
    />
  );
}
