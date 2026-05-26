import { jsPDF } from "jspdf";
import type { CollegeResult, CutoffRequest, UserDetails } from "@/lib/api";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const TABLE_X = 8.5;
const FIRST_PAGE_TABLE_Y = 160;
const OTHER_PAGES_TABLE_Y = 40;
const TABLE_WIDTH = 595;
const TABLE_HEADER_HEIGHT = 18;
const FIRST_PAGE_BODY_HEIGHT = 580;
const OTHER_PAGES_BODY_HEIGHT = 700;
const CELL_PADDING_X = 6;
const CELL_LINE_HEIGHT = 12;
const MIN_ROW_HEIGHT = 30;
const ROW_BASE_HEIGHT = 18;
const WATERMARK_PATH = "/logoup_cetrank.png";

const COLUMNS = [
  {
    header: "Code",
    width: 45,
    keys: ["college_code", "College_Code", "institute_code", "Institute_Code", "code", "Code"],
  },
  {
    header: "College Name",
    width: 140,
    keys: ["college_name", "College", "Name", "name"],
  },
  {
    header: "Branch",
    width: 90,
    keys: ["branch_name", "Branch", "branch", "course_name"],
  },
  {
    header: "Branch Code",
    width: 80,
    keys: ["branch_code", "Branch_Code", "choice_code", "ChoiceCode", "choiceCode"],
  },
  {
    header: "Category",
    width: 55,
    keys: ["category", "Category", "seat_type", "SeatType", "reservation_category", "user_category"],
  },
  {
    header: "Rank",
    width: 55,
    keys: ["rank", "Rank", "merit_no", "Merit_No", "merit", "Merit", "merit_rank", "cap_rank", "CAP_Rank"],
  },
  {
    header: "Percentile",
    width: 65,
    keys: [],
  },
  {
    header: "City",
    width: 65,
    keys: ["city", "City"],
  },
] as const;

type TableColumn = (typeof COLUMNS)[number];
type TableRow = {
  cells: string[][];
  height: number;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCollegeField = (college: CollegeResult, keys: readonly string[]) => {
  for (const key of keys) {
    const value = college[key];
    if (value !== null && value !== undefined && value !== "") {
      return normalizeText(String(value));
    }
  }

  return "";
};

const formatCutoff = (college: CollegeResult) => {
  const cutoffValue =
    college.CET_Percentile ??
    college.cet_percentile ??
    college.cutoff_percentile ??
    college.Percentile ??
    college.percentile;

  if (cutoffValue === null || cutoffValue === undefined || cutoffValue === "") {
    return "-";
  }

  const num = Number(cutoffValue);
  if (isNaN(num)) return normalizeText(String(cutoffValue));

  const formatted = Number.isInteger(num) ? String(num) : num.toFixed(2);
  return normalizeText(formatted);
};

const loadImageWithOpacity = (src: string, opacity: number) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas context is unavailable."));
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = opacity;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error(`Failed to load PDF background from ${src}.`));
    image.src = src;
  });

const buildRowValues = (college: CollegeResult) =>
  COLUMNS.map((column) => {
    if (column.header === "Percentile") {
      return formatCutoff(college);
    }

    return getCollegeField(college, column.keys) || "-";
  });

const buildTableRow = (doc: jsPDF, college: CollegeResult): TableRow => {
  const values = buildRowValues(college);

  const cells = values.map((value, index) => {
    const column = COLUMNS[index];
    const wrapped = doc.splitTextToSize(value || "-", column.width - CELL_PADDING_X * 2);
    return wrapped.length > 0 ? wrapped : ["-"];
  });

  const maxLines = Math.max(...cells.map((lines) => lines.length));
  const height = Math.max(MIN_ROW_HEIGHT, ROW_BASE_HEIGHT + maxLines * CELL_LINE_HEIGHT);

  return { cells, height };
};

const paginateRows = (rows: TableRow[], firstPageLimit: number, otherPageLimit: number) => {
  const pages: TableRow[][] = [];
  let currentPage: TableRow[] = [];
  let usedHeight = 0;
  let currentLimit = firstPageLimit;

  for (const row of rows) {
    const nextHeight = usedHeight + row.height;

    if (currentPage.length > 0 && nextHeight > currentLimit) {
      pages.push(currentPage);
      currentPage = [row];
      usedHeight = row.height;
      currentLimit = otherPageLimit;
      continue;
    }

    currentPage.push(row);
    usedHeight = nextHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
};

const drawWatermark = (doc: jsPDF, watermarkDataUrl?: string) => {
  if (!watermarkDataUrl) {
    return;
  }

  doc.addImage(watermarkDataUrl, "PNG", 56, 146, 500, 500, undefined, "FAST");
};

const drawUserDetails = (doc: jsPDF, user: UserDetails) => {
  // Increased box height for better spacing
  const boxHeight = 140;
  doc.setFillColor(249, 250, 251); // Gray-50
  doc.rect(TABLE_X, 20, TABLE_WIDTH, boxHeight, "F");
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.rect(TABLE_X, 20, TABLE_WIDTH, boxHeight, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.text("Candidate Preference Summary", TABLE_X + 15, 45);

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99); // Gray-600

  const leftX = TABLE_X + 15;
  const midX = TABLE_X + 210;
  const rightX = TABLE_X + 410;
  const startY = 65;
  const lineGap = 16; // Increased gap between rows

  // --- COLUMN 1: Profile Info ---
  doc.setFont("helvetica", "bold");
  doc.text("Profile Details", leftX, startY);
  doc.setFont("helvetica", "normal");
  
  let leftY = startY + 15;

  if (user.student_name) {
    doc.setFont("helvetica", "bold");
    doc.text(`Student: ${user.student_name}`, leftX, leftY);
    doc.setFont("helvetica", "normal");
    leftY += 12;
  }

  doc.text(`Gender: ${user.user_gender}`, leftX, leftY);
  
  leftY += 12;
  doc.text(`Category: ${user.user_category}`, leftX, leftY);
  
  leftY += 12;
  const uniText = `University: ${user.user_home_university}`;
  const wrappedUni = doc.splitTextToSize(uniText, 180);
  doc.text(wrappedUni, leftX, leftY);
  
  // Calculate how many lines university took (usually 10pt font height + 2pt extra padding)
  const uniLines = wrappedUni.length;
  leftY += (uniLines * 11); 

  const minority = user.user_minority_list?.filter(m => m.trim()).join(", ");
  if (minority) {
    const minorityText = `Minority: ${minority}`;
    const wrappedMin = doc.splitTextToSize(minorityText, 180);
    doc.text(wrappedMin, leftX, leftY);
  }

  // --- COLUMN 2: Academic scores ---
  doc.setFont("helvetica", "bold");
  doc.text("Academic Scores", midX, startY);
  doc.setFont("helvetica", "normal");
  
  let midY = startY + 15;
  const formatUserNum = (n: any) => {
    const num = Number(n);
    return isNaN(num) ? "0" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
  };

  doc.text(`CET Percentile: ${formatUserNum(user.percentile_cet)}`, midX, midY);
  
  midY += 12;
  doc.text(`AI Percentile: ${formatUserNum(user.percentile_ai)}`, midX, midY);
  
  if (user.calculated_bounds) {
    midY += 12;
    const minP = formatUserNum(user.calculated_bounds.min_percentile_cet);
    const maxP = formatUserNum(user.calculated_bounds.max_percentile_cet);
    doc.text(`CET Range: ${minP} - ${maxP}`, midX, midY);
  }

  // --- COLUMN 3: Location Filters ---
  doc.setFont("helvetica", "bold");
  doc.text("Location Filters", rightX, startY);
  doc.setFont("helvetica", "normal");
  
  let rightY = startY + 15;
  const cities = user.city?.length ? user.city.join(", ") : "All";
  const wrappedCities = doc.splitTextToSize(`Cities: ${cities}`, 170);
  doc.text(wrappedCities, rightX, rightY);
  
  rightY += (wrappedCities.length * 11) + 4;
  const divisions = user.division?.length ? user.division.join(", ") : "All";
  const wrappedDivs = doc.splitTextToSize(`Divisions: ${divisions}`, 170);
  doc.text(wrappedDivs, rightX, rightY);

  // --- BOTTOM ROW: Branches ---
  const branches = [];
  if (user.is_tech) branches.push("CS/IT");
  if (user.is_electronic) branches.push("EnTC");
  if (user.is_electrical) branches.push("Elec");
  if (user.is_mechanical) branches.push("Mech");
  if (user.is_civil) branches.push("Civil");
  if (user.is_other) branches.push("Other");
  
  const finalBranchY = 20 + boxHeight - 15; // Positioned near sample bottom
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text("Interested Branches: ", leftX, finalBranchY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text(branches.join(", ") || "None selected", leftX + 95, finalBranchY);
};

const drawHeader = (doc: jsPDF, tableY: number, tableHeight: number) => {
  doc.setFillColor(75, 85, 99); // Gray-600
  doc.rect(TABLE_X, tableY, TABLE_WIDTH, TABLE_HEADER_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(245, 245, 245);

  let cursorX = TABLE_X;
  for (const column of COLUMNS) {
    doc.text(column.header, cursorX + CELL_PADDING_X, tableY + 12);
    cursorX += column.width;
  }

  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.rect(TABLE_X, tableY, TABLE_WIDTH, tableHeight);
};

const drawGrid = (doc: jsPDF, tableY: number, pageRows: TableRow[]) => {
  let y = tableY + TABLE_HEADER_HEIGHT;

  for (const row of pageRows) {
    y += row.height;
    doc.line(TABLE_X, y, TABLE_X + TABLE_WIDTH, y);
  }

  let x = TABLE_X;
  for (const column of COLUMNS.slice(0, -1)) {
    x += column.width;
    doc.line(x, tableY, x, y);
  }
};

const drawRows = (doc: jsPDF, tableY: number, pageRows: TableRow[]) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  let rowTop = tableY + TABLE_HEADER_HEIGHT;

  for (const row of pageRows) {
    let cellX = TABLE_X;

    row.cells.forEach((lines, index) => {
      const column = COLUMNS[index];
      const textY = rowTop + row.height - 10 - (lines.length - 1) * CELL_LINE_HEIGHT;

      doc.text(lines, cellX + CELL_PADDING_X, textY, {
        lineHeightFactor: CELL_LINE_HEIGHT / 10,
      });

      cellX += column.width;
    });

    rowTop += row.height;
  }
};

export const downloadCollegeListPdf = async ({
  results,
  userDetails,
}: {
  results: CollegeResult[];
  filters?: CutoffRequest | null;
  userDetails?: UserDetails | null;
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const tableRows = results.map((college) => buildTableRow(doc, college));
  
  // Custom pagination based on userDetails presence
  const hasUserDetails = !!userDetails;
  const firstPageLimit = hasUserDetails ? FIRST_PAGE_BODY_HEIGHT : OTHER_PAGES_BODY_HEIGHT;
  const pages = paginateRows(tableRows, firstPageLimit, OTHER_PAGES_BODY_HEIGHT);

  let watermarkDataUrl: string | undefined;
  try {
    watermarkDataUrl = await loadImageWithOpacity(WATERMARK_PATH, 0.2);
  } catch (error) {
    console.warn("Unable to load the PDF background image.", error);
  }

  pages.forEach((pageRows, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

    drawWatermark(doc, watermarkDataUrl);

    if (pageIndex === 0 && userDetails) {
      drawUserDetails(doc, userDetails);
    }

    const currentTableY = (pageIndex === 0 && hasUserDetails) ? FIRST_PAGE_TABLE_Y : OTHER_PAGES_TABLE_Y;
    const tableHeight = TABLE_HEADER_HEIGHT + pageRows.reduce((total, row) => total + row.height, 0);

    drawHeader(doc, currentTableY, tableHeight);
    drawRows(doc, currentTableY, pageRows);
    drawGrid(doc, currentTableY, pageRows);
    
    // Page Number
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${pageIndex + 1} of ${pages.length}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 20, { align: "center" });
  });

  const nameSlug = userDetails?.student_name 
    ? userDetails.student_name.toLowerCase().replace(/\s+/g, "-").slice(0, 20) 
    : "college-list";
  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`cetrank-${nameSlug}-${dateTag}.pdf`);
};
