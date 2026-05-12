import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';

export default function FolderContextMenu( { folder, position, onRename, onDelete, onClose } ) {
	const [ isRenaming, setIsRenaming ] = useState( false );
	const [ renameValue, setRenameValue ] = useState( folder.name );
	const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState( false );

	const handleConfirmRename = () => {
		if ( renameValue.trim() && renameValue.trim() !== folder.name ) {
			onRename( folder.id, renameValue.trim() );
		}
		setIsRenaming( false );
		onClose();
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) handleConfirmRename();
		if ( e.key === 'Escape' ) { setIsRenaming( false ); onClose(); }
	};

	const handleConfirmDelete = () => {
		onDelete( folder.id );
		setIsDeleteModalOpen( false );
		onClose();
	};

	if ( isDeleteModalOpen ) {
		return (
			<Modal
				title={ __( 'Delete folder', 'snel' ) }
				onRequestClose={ () => { setIsDeleteModalOpen( false ); onClose(); } }
				size="small"
			>
				<p>
					{ __( 'Are you sure you want to delete', 'snel' ) } <strong>{ folder.name }</strong>?
				</p>
				<p className="text-gray-500 text-sm">
					{ __( 'Files inside this folder will not be deleted, they will be moved to Uncategorized.', 'snel' ) }
				</p>
				<div className="flex justify-end gap-2 mt-4">
					<Button variant="secondary" onClick={ () => { setIsDeleteModalOpen( false ); onClose(); } }>
						{ __( 'Cancel', 'snel' ) }
					</Button>
					<Button variant="primary" isDestructive onClick={ handleConfirmDelete }>
						{ __( 'Delete', 'snel' ) }
					</Button>
				</div>
			</Modal>
		);
	}

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-[99998]" onClick={ onClose } />

			{/* Context menu */}
			<div
				className="fixed z-[99999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
				style={ { top: position.y, left: position.x } }
			>
				{/* Header — folder name */}
				<div className="px-3 py-2 border-b border-gray-100">
					<span className="text-xs font-semibold text-gray-900">{ folder.name }</span>
				</div>

				{ isRenaming ? (
					<div className="flex items-center gap-1 px-2 py-2">
						<input
							type="text"
							value={ renameValue }
							onChange={ ( e ) => setRenameValue( e.target.value ) }
							onKeyDown={ handleKeyDown }
							autoFocus
							className="flex-1 px-2 py-1 text-[13px] border border-blue-600 rounded outline-none"
						/>
						<button
							onClick={ handleConfirmRename }
							className="flex items-center justify-center w-6 h-6 rounded text-green-600 hover:bg-green-50 cursor-pointer border-none bg-transparent"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 6 9 17l-5-5"/>
							</svg>
						</button>
						<button
							onClick={ () => { setIsRenaming( false ); onClose(); } }
							className="flex items-center justify-center w-6 h-6 rounded text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
							</svg>
						</button>
					</div>
				) : (
					<>
						<button
							className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 bg-transparent border-none cursor-pointer hover:bg-gray-50 text-left"
							onClick={ () => setIsRenaming( true ) }
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
							</svg>
							{ __( 'Rename', 'snel' ) }
						</button>
						<button
							className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 bg-transparent border-none cursor-pointer hover:bg-red-50 text-left"
							onClick={ () => setIsDeleteModalOpen( true ) }
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
							</svg>
							{ __( 'Delete', 'snel' ) }
						</button>
					</>
				) }
			</div>
		</>
	);
}
