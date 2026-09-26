export function Keys({ keys }: { keys: string[] }) {
    return (
        <span className="keys">
            {keys.map(key => (
                <kbd key={key}>{key}</kbd>
            ))}
        </span>
    )
}
