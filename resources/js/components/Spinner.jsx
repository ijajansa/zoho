export default function Spinner({ className = 'size-5' }) {
    return <span className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`} aria-label="Loading" />;
}
