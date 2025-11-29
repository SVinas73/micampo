import React from "react";

export function Alert({ 
  className = "", 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 bg-white border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ 
  className = "", 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ 
  className = "", 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}