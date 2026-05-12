/**
 * Snel Media Folders — API service.
 *
 * All REST calls to snel/v1/folders.
 */

const getConfig = () => ({
	url: window.snelMediaFolders?.restUrl || '/wp-json/snel/v1',
	nonce: window.snelMediaFolders?.nonce || '',
});

const headers = () => ( {
	'Content-Type': 'application/json',
	'X-WP-Nonce': getConfig().nonce,
} );

export async function fetchFolders() {
	const res = await fetch( `${ getConfig().url }/folders`, {
		headers: headers(),
		credentials: 'same-origin',
	} );
	return res.json();
}

export async function createFolder( name, parent = 0 ) {
	const res = await fetch( `${ getConfig().url }/folders`, {
		method: 'POST',
		headers: headers(),
		credentials: 'same-origin',
		body: JSON.stringify( { name, parent } ),
	} );
	return res.json();
}

export async function renameFolder( id, name ) {
	const res = await fetch( `${ getConfig().url }/folders/rename`, {
		method: 'POST',
		headers: headers(),
		credentials: 'same-origin',
		body: JSON.stringify( { id, name } ),
	} );
	return res.json();
}

export async function deleteFolder( id ) {
	const res = await fetch( `${ getConfig().url }/folders/delete`, {
		method: 'POST',
		headers: headers(),
		credentials: 'same-origin',
		body: JSON.stringify( { id } ),
	} );
	return res.json();
}

export async function assignFolder( folderId, attachmentIds ) {
	const res = await fetch( `${ getConfig().url }/folders/assign`, {
		method: 'POST',
		headers: headers(),
		credentials: 'same-origin',
		body: JSON.stringify( { folderId, attachmentIds } ),
	} );
	return res.json();
}
