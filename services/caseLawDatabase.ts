// F3: Simulated Case Law Database for RAG Enhancement
// This provides "ground truth" legal citations that can be injected into AI context

export interface CaseLawEntry {
    citation: string;
    jurisdiction: string;
    year: number;
    practiceArea: string[];
    summary: string;
    keyHolding: string;
    relevantStatutes?: string[];
}

export const MOCK_CASE_LAW_DB: CaseLawEntry[] = [
    {
        citation: "Miranda v. Arizona, 384 U.S. 436 (1966)",
        jurisdiction: "U.S. Supreme Court",
        year: 1966,
        practiceArea: ["Criminal Defense", "Constitutional Law"],
        summary: "Landmark case establishing the requirement for law enforcement to inform suspects of their rights before custodial interrogation.",
        keyHolding: "Suspects must be informed of their right to remain silent and right to an attorney before interrogation.",
        relevantStatutes: ["Fifth Amendment", "Sixth Amendment"]
    },
    {
        citation: "Brown v. Board of Education, 347 U.S. 483 (1954)",
        jurisdiction: "U.S. Supreme Court",
        year: 1954,
        practiceArea: ["Civil Rights", "Education Law"],
        summary: "Declared state laws establishing separate public schools for black and white students unconstitutional.",
        keyHolding: "Separate educational facilities are inherently unequal.",
        relevantStatutes: ["Fourteenth Amendment"]
    },
    {
        citation: "Roe v. Wade, 410 U.S. 113 (1973)",
        jurisdiction: "U.S. Supreme Court",
        year: 1973,
        practiceArea: ["Constitutional Law", "Health Law"],
        summary: "Established a woman's legal right to an abortion under the Fourteenth Amendment.",
        keyHolding: "The Constitution protects a woman's liberty to choose to have an abortion without excessive government restriction.",
        relevantStatutes: ["Fourteenth Amendment"]
    },
    {
        citation: "Gideon v. Wainwright, 372 U.S. 335 (1963)",
        jurisdiction: "U.S. Supreme Court",
        year: 1963,
        practiceArea: ["Criminal Defense", "Constitutional Law"],
        summary: "Established the right to counsel for criminal defendants who cannot afford their own attorneys.",
        keyHolding: "States are required to provide attorneys for defendants in criminal cases who cannot afford their own.",
        relevantStatutes: ["Sixth Amendment"]
    },
    {
        citation: "New York Times Co. v. Sullivan, 376 U.S. 254 (1964)",
        jurisdiction: "U.S. Supreme Court",
        year: 1964,
        practiceArea: ["First Amendment", "Defamation"],
        summary: "Established the actual malice standard for defamation cases involving public figures.",
        keyHolding: "Public officials cannot recover damages for defamatory falsehood relating to official conduct unless actual malice is proven.",
        relevantStatutes: ["First Amendment"]
    },
    {
        citation: "Terry v. Ohio, 392 U.S. 1 (1968)",
        jurisdiction: "U.S. Supreme Court",
        year: 1968,
        practiceArea: ["Criminal Defense", "Constitutional Law"],
        summary: "Established the stop-and-frisk doctrine allowing police to conduct brief investigative stops.",
        keyHolding: "Police may conduct a limited search for weapons when they have reasonable suspicion of criminal activity.",
        relevantStatutes: ["Fourth Amendment"]
    },
    {
        citation: "Mapp v. Ohio, 367 U.S. 643 (1961)",
        jurisdiction: "U.S. Supreme Court",
        year: 1961,
        practiceArea: ["Criminal Defense", "Constitutional Law"],
        summary: "Applied the exclusionary rule to state courts, prohibiting use of illegally obtained evidence.",
        keyHolding: "Evidence obtained in violation of the Fourth Amendment cannot be used in state criminal prosecutions.",
        relevantStatutes: ["Fourth Amendment"]
    },
    {
        citation: "Marbury v. Madison, 5 U.S. 137 (1803)",
        jurisdiction: "U.S. Supreme Court",
        year: 1803,
        practiceArea: ["Constitutional Law"],
        summary: "Established the principle of judicial review.",
        keyHolding: "The Supreme Court has the authority to review and invalidate laws that conflict with the Constitution.",
        relevantStatutes: ["Article III"]
    },
    {
        citation: "Palsgraf v. Long Island Railroad Co., 248 N.Y. 339 (1928)",
        jurisdiction: "New York Court of Appeals",
        year: 1928,
        practiceArea: ["Torts", "Personal Injury"],
        summary: "Established the concept of proximate cause in negligence cases.",
        keyHolding: "Liability for negligence only exists if the harm was a reasonably foreseeable consequence of the act.",
        relevantStatutes: ["Common Law Negligence"]
    },
    {
        citation: "Hadley v. Baxendale [1854] EWHC J70",
        jurisdiction: "Court of Exchequer",
        year: 1854,
        practiceArea: ["Contracts", "Business Litigation"],
        summary: "Established the rule for consequential damages in contract cases.",
        keyHolding: "Damages for breach of contract should be those that arise naturally from the breach or were in the contemplation of both parties.",
        relevantStatutes: ["Common Law Contracts"]
    },
    {
        citation: "Loving v. Virginia, 388 U.S. 1 (1967)",
        jurisdiction: "U.S. Supreme Court",
        year: 1967,
        practiceArea: ["Constitutional Law", "Family Law"],
        summary: "Invalidated laws prohibiting interracial marriage.",
        keyHolding: "Marriage is one of the basic civil rights of man, fundamental to our very existence and survival.",
        relevantStatutes: ["Fourteenth Amendment"]
    },
    {
        citation: "Meritor Savings Bank v. Vinson, 477 U.S. 57 (1986)",
        jurisdiction: "U.S. Supreme Court",
        year: 1986,
        practiceArea: ["Employment Law", "Civil Rights"],
        summary: "Recognized sexual harassment as a violation of Title VII.",
        keyHolding: "A claim of 'hostile environment' sexual harassment is a form of sex discrimination actionable under Title VII.",
        relevantStatutes: ["Title VII of the Civil Rights Act of 1964"]
    }
];

/**
 * F3: RAG-Enhanced Search
 * Filters the case law database by practice area and returns relevant citations
 */
export const searchCaseLawDatabase = (practiceArea?: string, keywords?: string): CaseLawEntry[] => {
    let results = MOCK_CASE_LAW_DB;

    if (practiceArea) {
        results = results.filter(entry =>
            entry.practiceArea.some(area =>
                area.toLowerCase().includes(practiceArea.toLowerCase())
            )
        );
    }

    if (keywords) {
        const lowerKeywords = keywords.toLowerCase();
        results = results.filter(entry =>
            entry.citation.toLowerCase().includes(lowerKeywords) ||
            entry.summary.toLowerCase().includes(lowerKeywords) ||
            entry.keyHolding.toLowerCase().includes(lowerKeywords)
        );
    }

    return results;
};
