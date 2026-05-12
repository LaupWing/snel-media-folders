import { __ } from '@wordpress/i18n';

function NewFolderInput( { depth, name, onChange, onConfirm, onCancel, onKeyDown } ) {
	return (
		<div
			className="flex items-center gap-1 py-1.5"
			style={ { paddingLeft: `${ 12 + depth * 16 }px`, paddingRight: '12px' } }
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a7aaad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
				<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
			</svg>
			<input
				type="text"
				value={ name }
				onChange={ ( e ) => onChange( e.target.value ) }
				onKeyDown={ onKeyDown }
				placeholder={ __( 'Folder name...', 'snel' ) }
				autoFocus
				className="flex-1 px-2 py-1 text-[13px] border border-blue-600 rounded outline-none focus:shadow-[0_0_0_1px_#2271b1]"
			/>
			<button
				onClick={ onConfirm }
				className="flex items-center justify-center w-6 h-6 rounded text-green-600 hover:bg-green-50 cursor-pointer border-none bg-transparent transition-colors shrink-0"
				title={ __( 'Confirm', 'snel' ) }
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M20 6 9 17l-5-5"/>
				</svg>
			</button>
			<button
				onClick={ onCancel }
				className="flex items-center justify-center w-6 h-6 rounded text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent transition-colors shrink-0"
				title={ __( 'Cancel', 'snel' ) }
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
				</svg>
			</button>
		</div>
	);
}

export default function FolderTree( {
	folders, activeFolder, onSelect, parentId, depth,
	isCreating, newFolderParent, newFolderName, onNewFolderNameChange,
	onNewFolderConfirm, onNewFolderCancel, onNewFolderKeyDown,
	onContextMenu,
} ) {
	const children = folders.filter( ( f ) => f.parent === parentId );
	const showInputHere = isCreating && newFolderParent === parentId;

	if ( children.length === 0 && ! showInputHere ) return null;

	return (
		<>
			{ children.map( ( folder ) => {
				const hasChildren = folders.some( ( f ) => f.parent === folder.id );
				const isActive = activeFolder === folder.id;
				const showInputNested = isCreating && newFolderParent === folder.id;

				return (
					<div key={ folder.id }>
						<button
							data-folder-id={ folder.id }
							className={ `flex items-center gap-2 w-full py-2 text-[13px] text-left border-none cursor-pointer transition-colors ${ isActive ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900' }` }
							onClick={ () => onSelect( folder.id ) }
							onContextMenu={ ( e ) => {
								e.preventDefault();
								if ( onContextMenu ) onContextMenu( e, folder );
							} }
							style={ { paddingLeft: `${ 12 + depth * 16 }px`, paddingRight: '12px' } }
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
							</svg>
							<span className="snel-folder-name flex-1 truncate">{ folder.name }</span>
							<span className={ `text-[11px] min-w-[20px] text-right ${ isActive ? 'text-white/70' : 'text-gray-400' }` }>{ folder.count }</span>
						</button>

						{ ( hasChildren || showInputNested ) && (
							<FolderTree
								folders={ folders }
								activeFolder={ activeFolder }
								onSelect={ onSelect }
								parentId={ folder.id }
								depth={ depth + 1 }
								isCreating={ isCreating }
								newFolderParent={ newFolderParent }
								newFolderName={ newFolderName }
								onNewFolderNameChange={ onNewFolderNameChange }
								onNewFolderConfirm={ onNewFolderConfirm }
								onNewFolderCancel={ onNewFolderCancel }
								onNewFolderKeyDown={ onNewFolderKeyDown }
								onContextMenu={ onContextMenu }
							/>
						) }
					</div>
				);
			} ) }

			{ showInputHere && (
				<NewFolderInput
					depth={ depth }
					name={ newFolderName }
					onChange={ onNewFolderNameChange }
					onConfirm={ onNewFolderConfirm }
					onCancel={ onNewFolderCancel }
					onKeyDown={ onNewFolderKeyDown }
				/>
			) }
		</>
	);
}
