export default function Card({ className = '', children, inset = false, ...props }) {
  return (
    <div
      className={`bg-card ${inset ? 'rounded-ios-lg' : 'rounded-ios-lg shadow-ios'} overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
