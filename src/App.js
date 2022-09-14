import { useState, useEffect } from "react";
import * as XLSX from "xlsx/xlsx.mjs";
import { saveAs } from "file-saver";

import { ref, set, onValue } from "firebase/database";
import { db, auth } from "./firebase";

import Logo from "./assets/logo.svg";
import Brand from "./assets/title.svg";

const App = () => {
	const [books, setBooks] = useState([]);

	const handleFile = (e) => {
		const reader = new FileReader();

		if (
			e.target.files[0].type ==
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		) {
			reader.addEventListener("load", (event) => {
				let data = event.target.result;

				let workbook = XLSX.read(data, {
					type: "binary",
				});

				workbook.SheetNames.forEach((sheet) => {
					let rowObject = XLSX.utils.sheet_to_row_object_array(
						workbook.Sheets[sheet]
					);

					rowObject.map((element) => {
						setBooks((prev) => [...prev, element]);
					});
				});
			});

			reader.readAsBinaryString(e.target.files[0]);
		} else {
			alert("Wrong file type");
		}
	};

	const handleButton = () => {
		if (books.length != 0) {
			books.map((book) => {
				const reference = ref(db, "books/" + book.ISBN);

				set(reference, {
					CLIENT: book["CODE CLIENT"],
					ISBN: book.ISBN,
					QTE: book["QTE LIV"],
					TITLE: book.TITRE,
					ARRIVED_QTE: 0,
					CALCULATION: 0,
				});
			});

			alert("File uploaded successfully");
		} else {
			alert("Choose a file to upload");
		}
	};

	// DOWNLOAD FUNCTION
	const handleDownload = () => {
		const reference = ref(db, "books");

		let res = [];

		onValue(reference, (snapshot) => {
			let data = snapshot.val();

			for (const key in data) {
				res.push(data[key]);
			}
		});

		if (res.length != 0) {
			console.log(res);

			exportDataToExcel(res);
		} else {
			alert("Aucun fichier trouvé!");
		}
	};

	const exportDataToExcel = async (data) => {
		const fileType =
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

		const ws = await XLSX.utils.json_to_sheet(data);
		const wb = await { Sheets: { data: ws }, SheetNames: ["data"] };
		const excelBuffer = await XLSX.write(wb, {
			bookType: "xlsx",
			type: "array",
		});
		const res = new Blob([excelBuffer], { type: fileType });

		saveAs(res, "test.xlsx");
	};

	return (
		<div className="app">
			<img src={Logo} className="logo" />

			<img src={Brand} className="brand" />

			<div className="custom-input">
				<input
					type="file"
					id="file"
					placeholder="File"
					onChange={handleFile}
					accept="xlsx"
				/>

				<div className="text">
					<p>Choose a file...</p>
				</div>

				<button className="browse">Browse</button>
			</div>

			<button className="upload" onClick={handleButton}>
				Upload
			</button>

			<button className="upload" onClick={handleDownload}>
				Download
			</button>
		</div>
	);
};

export default App;
