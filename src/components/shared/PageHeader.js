import React from 'react'
import styles from './PageHeader.module.css'

export default function PageHeader({ title, subtitle, logo }) {
  return (
    <header className={styles.pageHeader}>
      <div className="container">
        <div className={styles.headerContent}>
          {title && (
            <div className={styles.titleWrapper}>     
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          )}
          {logo && <img src={logo} alt="Logo" className={styles.headerLogo} />}
        </div>
      </div>
    </header>
  )
}
