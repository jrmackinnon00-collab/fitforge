function LoadingSpinner({ size = 'md', message = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-orange-500/20 border-t-orange-500 rounded-full animate-spin`}
        style={{ borderWidth: size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px' }}
      />
      {message && (
        <p className="text-slate-400 text-sm font-medium">{message}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
