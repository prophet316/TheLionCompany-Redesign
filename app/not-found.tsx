import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section shell">
      <p className="eyebrow">404 · Outside the gathered path</p>
      <h1>This page is not here.</h1>
      <p>The teaching, conversation, or resource may have moved. Choose a real path back into the gathering.</p>
      <div className="cluster">
        <Link className="button" href="/">
          Return home
        </Link>
        <Link href="/teachings">Explore teachings</Link>
        <Link href="/podcast">Listen to the podcast</Link>
      </div>
    </section>
  );
}
