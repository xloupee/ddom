export default function PopupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="popup-container">
            {children}
        </div>
    )
}
