import React, { useEffect, useState } from 'react';
import { Box, IconButton, TextField, Avatar } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';

const FileItem = ({ file, onExclude }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  // URLs de preview para imagens
  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mt: 2,
      }}
    >
      {/* Imagem de preview do arquivo */}
      {isImage ? (
        <Avatar
          src={previewUrl}
          alt={file.name}
          variant="square"
          sx={{ width: 40, height: 40, mr: 1 }}
        />
      ) : isPDF ? (
        <Avatar
          variant="square"
          sx={{
            width: 40,
            height: 40,
            mr: 1,
            backgroundColor: '#f44336',
            color: '#fff',
          }}
        >
          <PictureAsPdfIcon />
        </Avatar>
      ) : (
        <Avatar
          variant="square"
          sx={{
            width: 40,
            height: 40,
            mr: 1,
            backgroundColor: '#607d8b',
            color: '#fff',
          }}
        >
          <InsertDriveFileIcon />
        </Avatar>
      )}

      <TextField
        value={file.name}
        fullWidth
        variant="outlined"
        size="small"
      />
        <Tooltip title="Remover arquivo">
          <span>
            <IconButton
              onClick={() => onExclude(file)}
              color="error"
              sx={{ ml: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
    </Box>
  );
};
export default FileItem;