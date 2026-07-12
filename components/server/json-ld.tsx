export function JsonLd({ id, data }: { id: string; data: object | readonly object[] }) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
