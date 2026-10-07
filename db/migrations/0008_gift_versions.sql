CREATE TABLE gift_versions (
 gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, content TEXT NOT NULL, template TEXT NOT NULL,
 box_config TEXT, saved_at INTEGER NOT NULL, PRIMARY KEY(gift_id,revision)
);
CREATE TRIGGER gift_version_before_edit BEFORE UPDATE OF content,template,box_config ON gifts
WHEN (OLD.content IS NOT NEW.content OR OLD.template IS NOT NEW.template OR OLD.box_config IS NOT NEW.box_config)
 AND json_valid(OLD.content) AND length(trim(json_extract(OLD.content,'$.yourName')))>0
 AND length(trim(json_extract(OLD.content,'$.partnerName')))>0
 AND length(json_extract(OLD.content,'$.date'))=10
BEGIN
 INSERT OR IGNORE INTO gift_versions(gift_id,revision,content,template,box_config,saved_at)
 VALUES(OLD.id,OLD.revision,OLD.content,OLD.template,OLD.box_config,OLD.updated_at);
 DELETE FROM gift_versions WHERE gift_id=OLD.id AND revision NOT IN
 (SELECT revision FROM gift_versions WHERE gift_id=OLD.id ORDER BY revision DESC LIMIT 20);
END;
