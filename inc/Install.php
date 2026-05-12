<?php
/**
 * Snel Media Folders — Database table creation.
 *
 * @package SnelMediaFolders
 */

namespace Snel\MediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Install {

    public static function create_tables() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();

        $folders_table   = $wpdb->prefix . 'snel_folders';
        $relations_table = $wpdb->prefix . 'snel_folder_attachments';

        $sql = "CREATE TABLE {$folders_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            name varchar(250) NOT NULL,
            parent bigint(20) unsigned DEFAULT 0,
            ord int DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY parent (parent)
        ) {$charset};

        CREATE TABLE {$relations_table} (
            folder_id bigint(20) unsigned NOT NULL,
            attachment_id bigint(20) unsigned NOT NULL,
            PRIMARY KEY (folder_id, attachment_id),
            KEY attachment_id (attachment_id)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }
}
