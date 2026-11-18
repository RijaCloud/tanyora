import Link from "next/link";

type ModuleCardProps = {
  image: string;
  title: string;
  description: string;
  href: string;
};

export function ModuleCard({ image, title, description, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group relative block h-[220px] overflow-hidden rounded-[20px] transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url(${image})` }}
      />
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 text-white">
        <h3 className="mb-1 text-xl font-bold">{title}</h3>
        <p className="line-clamp-2 text-sm opacity-90">{description}</p>
      </div>
    </Link>
  );
}