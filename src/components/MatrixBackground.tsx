import React from 'react'
import styles from './MatrixBackground.module.css'

export default function MatrixBackground() {
    // Render 40 columns inside a pattern
    const columns = Array.from({ length: 40 })

    // Render 4 patterns (as in the original code: 4 div.matrix-pattern)
    const patterns = Array.from({ length: 4 })

    return (
        <div className={styles.matrixContainer}>
            {patterns.map((_, pIndex) => (
                <div key={pIndex} className={styles.matrixPattern}>
                    {columns.map((_, cIndex) => (
                        <div key={cIndex} className={styles.matrixColumn} />
                    ))}
                </div>
            ))}
        </div>
    )
}
